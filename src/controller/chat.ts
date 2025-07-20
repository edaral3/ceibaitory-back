import axios from 'axios'
import config from '../config/config'
import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema({
  name: String,
  content: String,
  // ...other fields
});

const Prompts = mongoose.model('prompts', promptSchema);

const chat = async (req: any, res: any): Promise<void> => {
  try {
    const items = await req.CollectionCrud.find({ company: req.company });
    const names = items.map(item => `${[item.name]}: ${item.existence}`).join(', ');
    const prompt = await Prompts.findOne({company: req.companyName})

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found for this company.' });
    }
    const nameString = prompt?.content?.replace('{products}', names);

    const { messages } = req.body;

    const products = 
        {
            "role": "system",
            "content": nameString
        }
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [products, ...messages],
        stream: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekApiKey}`,
        },
      })

    return res.send(response.data)
  } catch (error: any) {
    res.status(500).json({ message: `Error in chat controller: ${error.message}` })
  }
}

export default {
  chat
}

import axios from 'axios'
import config from '../config/config'

const chat = async (req: any, res: any): Promise<void> => {
  try {
    const items = await req.CollectionCrud.find({ company: req.company },  'name');
    const names = items.map(item => item.name);
    const nameString = `
    Eres un consultor experto en temas de agroindustria, tu objetivo es ayudar a los usuarios a encontrar productos que puedan ser de ayuda para sus necesidades. Tu conocimiento abarca una amplia gama de productos relacionados con la agroindustria, incluyendo fertilizantes, pesticidas, semillas, maquinaria agrícola, medicamentos, vitaminas y mas. Tu tarea es proporcionar recomendaciones precisas y útiles basadas en las preguntas que te hagan los usuarios.
    Para cualquier pregunta que se te haga ten en cuenta estos productos: ['${names.join(', ')}'] y las respuestas que sean directas y concisas, debes recomendar alguno de los productos de la lista de ser posible y una breve explicación del por que.
    responde unicamente con el nombre del producto de esta forma y una breve explicación de por que lo recomiendas. Si no puedes recomendar ninguno de los productos, responde con "No puedo recomendar ninguno de los productos" o si no esta relazionado con los productos de la lista, responde "No puedo responder a esta pregunta".
    usa esta estructura para responder:
    Te comparto estos productos que podrian ser de ayuda:

    [[nombre del producto]]: por que lo recomiendas 
    `;


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
    console.log('Error in chat controller:', error.message);
    res.status(500).json({ message: `Error in chat controller: ${error.message}` })
  }
}

export default {
  chat
}

import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import mongoose from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { AppConfigService } from '../../core/config/app-config.service'

const promptSchema = new mongoose.Schema({
  name: String,
  content: String,
  company: String
})

const Prompts = mongoose.model('prompts', promptSchema)

@Injectable()
export class ChatService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService,
    private readonly config: AppConfigService
  ) {}

  async createChatCompletion (payload: { messages: any[] }): Promise<any> {
    try {
      const items = await this.collections
        .get('crud')
        .find({ company: this.requestContext.companyId })
      const names = items
        .map((item: any) => `${item.name}: ${item.existence}`)
        .join(', ')
      const prompt = await Prompts.findOne({
        company: this.requestContext.companyName
      })
      if (!prompt) {
        throw new InternalServerErrorException(
          'Prompt not found for this company.'
        )
      }
      const nameString = prompt?.content?.replace('{products}', names)
      const productsPrompt = {
        role: 'system',
        content: nameString
      }
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [productsPrompt, ...(payload.messages ?? [])],
          stream: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.deepseekApiKey}`
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error in chat controller: ${error.message}`
      )
    }
  }
}

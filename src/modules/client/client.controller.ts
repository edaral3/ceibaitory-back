import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common'
import { ClientService } from './client.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateClientDto } from '../../dto/client/create-client.dto'
import { UpdateClientDto } from '../../dto/client/update-client.dto'

@Controller('client')
@UseGuards(JwtAuthGuard)
@UseCollection('client')
export class ClientController {
  constructor (private readonly clientService: ClientService) {}

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: CreateClientDto): Promise<any> {
    return this.clientService.create(body)
  }

  @Put(':id')
  @Roles('owner', 'admin')
  update (@Param('id') id: string, @Body() body: UpdateClientDto): Promise<any> {
    return this.clientService.update(id, body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  delete (@Param('id') id: string): Promise<string> {
    return this.clientService.delete(id)
  }

  @Get()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findAll (): Promise<any[]> {
    return this.clientService.getAll()
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findOne (@Param('id') id: string): Promise<any> {
    return this.clientService.getOne(id)
  }
}

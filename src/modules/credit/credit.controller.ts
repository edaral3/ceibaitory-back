import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes
} from '@nestjs/common'
import { CreditService } from './credit.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateCreditDto } from '../../dto/credit/create-credit.dto'
import { PayCreditDto } from '../../dto/credit/pay-credit.dto'

@Controller('credit')
@UseGuards(JwtAuthGuard)
@UseCollection('credit')
export class CreditController {
  constructor (private readonly creditService: CreditService) {}

  @Post()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  create (@Body() body: CreateCreditDto): Promise<any> {
    return this.creditService.createCredit(body)
  }

  @Put('pay/:id')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  pay (@Param('id') id: string, @Body() body: PayCreditDto): Promise<any> {
    return this.creditService.payCredit(id, body)
  }

  @Put('unpaid/:id')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  markUnpaid (@Param('id') id: string): Promise<any> {
    return this.creditService.markUnpaid(id)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  cancel (@Param('id') id: string): Promise<string> {
    return this.creditService.cancelCredit(id)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findOne (@Param('id') id: string): Promise<any> {
    return this.creditService.getCredit(id)
  }

  @Get()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findAll (): Promise<any[]> {
    return this.creditService.getCredits()
  }
}

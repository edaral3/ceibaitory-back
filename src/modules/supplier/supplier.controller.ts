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
import { SupplierService } from './supplier.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateSupplierDto } from '../../dto/supplier/create-supplier.dto'
import { UpdateSupplierDto } from '../../dto/supplier/update-supplier.dto'

@Controller('supplier')
@UseGuards(JwtAuthGuard)
@UseCollection('supplier')
export class SupplierController {
  constructor (private readonly supplierService: SupplierService) {}

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: CreateSupplierDto): Promise<any> {
    return this.supplierService.create(body)
  }

  @Put(':id')
  @Roles('owner', 'admin')
  update (@Param('id') id: string, @Body() body: UpdateSupplierDto): Promise<any> {
    return this.supplierService.update(id, body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  delete (@Param('id') id: string): Promise<string> {
    return this.supplierService.delete(id)
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findOne (@Param('id') id: string): Promise<any> {
    return this.supplierService.getOne(id)
  }

  @Get()
  @Roles('owner', 'admin')
  findAll (): Promise<any[]> {
    return this.supplierService.getAll()
  }
}

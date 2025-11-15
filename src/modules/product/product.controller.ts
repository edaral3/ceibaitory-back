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
import { ProductService } from './product.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateProductDto } from '../../dto/product/create-product.dto'
import { UpdateProductDto } from '../../dto/product/update-product.dto'

@Controller('product')
@UseGuards(JwtAuthGuard)
@UseCollection('product')
export class ProductController {
  constructor (private readonly productService: ProductService) {}

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: CreateProductDto): Promise<any> {
    return this.productService.create(body)
  }

  @Put(':id')
  @Roles('owner', 'admin')
  update (@Param('id') id: string, @Body() body: UpdateProductDto): Promise<any> {
    return this.productService.update(id, body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  delete (@Param('id') id: string): Promise<string> {
    return this.productService.delete(id)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findOne (@Param('id') id: string): Promise<any> {
    return this.productService.getOne(id)
  }

  @Get()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findAll (): Promise<any[]> {
    return this.productService.getAll()
  }
}

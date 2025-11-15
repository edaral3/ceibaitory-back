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
import { BranchService } from './branch.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateBranchDto } from '../../dto/branch/create-branch.dto'
import { UpdateBranchDto } from '../../dto/branch/update-branch.dto'

@Controller('branch')
@UseGuards(JwtAuthGuard)
@UseCollection('branch')
export class BranchController {
  constructor (private readonly branchService: BranchService) {}

  @Post()
  @Roles('owner')
  create (@Body() body: CreateBranchDto): Promise<any> {
    return this.branchService.create(body)
  }

  @Put(':id')
  @Roles('owner')
  update (@Param('id') id: string, @Body() body: UpdateBranchDto): Promise<any> {
    return this.branchService.update(id, body)
  }

  @Delete(':id')
  @Roles('owner')
  delete (@Param('id') id: string): Promise<string> {
    return this.branchService.delete(id)
  }

  @Get(':id')
  @Roles('owner')
  findOne (@Param('id') id: string): Promise<any> {
    return this.branchService.getOne(id)
  }

  @Get()
  @Roles('owner')
  findAll (): Promise<any[]> {
    return this.branchService.getAll()
  }
}

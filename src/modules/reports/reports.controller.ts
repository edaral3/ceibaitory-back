import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'

@Controller('reports')
@UseGuards(JwtAuthGuard)
@UseCollection('report')
export class ReportsController {
  constructor (private readonly reportsService: ReportsService) {}

  @Get('dailyReports')
  @Roles('owner')
  getDailyReports (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.getDailyReports(query)
  }

  @Get('montlyReports')
  @Roles('owner')
  getMonthlyReports (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.getMonthlyReports(query)
  }

  @Get('inventoryExcelReport')
  @Roles('owner')
  getInventoryExcel (): Promise<any> {
    return this.reportsService.getInventoryExcelReport()
  }

  @Get('salesReport')
  @Roles('owner')
  getSalesReport (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.getSalesReportPdf(query)
  }

  @Get('productsOutOfStockReport')
  @Roles('owner')
  getProductsOutOfStock (): Promise<any> {
    return this.reportsService.getProductsOutOfStockPdf()
  }

  @Get('productsOutOfStockWithWarehouseReport')
  @Roles('owner')
  getProductsOutOfStockWithWarehouse (): Promise<any> {
    return this.reportsService.getProductsOutOfStockWithWarehousePdf()
  }

  @Get('productsOutOfStockWithWarehouseData')
  @Roles('owner')
  getProductsOutOfStockWithWarehouseData (): Promise<any> {
    return this.reportsService.getProductsOutOfStockWithWarehouseData()
  }

  @Get('expiringProducts')
  @Roles('owner')
  getExpiringProducts (): Promise<any> {
    return this.reportsService.getExpiringProductsPdf()
  }

  @Get('top10ABC')
  @Roles('owner')
  getTop10ABC (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.getTop10ABCReport(query)
  }

  @Get('productsOutOfStockOfExpired')
  @Roles('owner')
  getProductsOutOfStockOfExpired (): Promise<any> {
    return this.reportsService.getProductsOutOfStockVsExpired()
  }

  @Get('inventoryAlerts')
  @Roles('owner')
  getInventoryAlerts (): Promise<any> {
    return this.reportsService.getInventoryAlertsReport()
  }

  @Get('sixMonthsReports')
  @Roles('owner')
  getSixMonthsReports (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.getSixMonthsReports(query)
  }

  @Get('predict/productDemand')
  @Roles('owner')
  predictProductDemand (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.predictProductDemandReport(query)
  }

  @Get('predict/monthlyProfit')
  @Roles('owner')
  predictMonthlyProfit (@Query() query: Record<string, any>): Promise<any> {
    return this.reportsService.predictMonthlyProfitReport(query)
  }

  @Post('getCreditInfo')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  getCreditInfo (@Body() body: any): Promise<any> {
    return this.reportsService.getCreditInfoPdf(body)
  }
}

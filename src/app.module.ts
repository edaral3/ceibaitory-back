import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AppConfigModule } from './core/config/config.module'
import { RequestContextModule } from './core/context/context.module'
import { CollectionsInterceptor } from './core/interceptors/collections.interceptor'
import { AppController } from './app.controller'
import { ClientModule } from './modules/client/client.module'
import { SupplierModule } from './modules/supplier/supplier.module'
import { BranchModule } from './modules/branch/branch.module'
import { ProductModule } from './modules/product/product.module'
import { StoreModule } from './modules/store/store.module'
import { StoreItemsModule } from './modules/store-items/store-items.module'
import { SaleModule } from './modules/sale/sale.module'
import { PurchaseModule } from './modules/purchase/purchase.module'
import { CreditModule } from './modules/credit/credit.module'
import { UserModule } from './modules/user/user.module'
import { ChatModule } from './modules/chat/chat.module'
import { ReportsModule } from './modules/reports/reports.module'
import { FarmModule } from './modules/farm/farm.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [
    AppConfigModule,
    RequestContextModule,
    ClientModule,
    SupplierModule,
    BranchModule,
    ProductModule,
    StoreModule,
    StoreItemsModule,
    SaleModule,
    PurchaseModule,
    CreditModule,
    UserModule,
    ChatModule,
    ReportsModule,
    FarmModule,
    AuthModule
    // Feature modules will be registered here
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CollectionsInterceptor
    }
  ]
})
export class AppModule {}

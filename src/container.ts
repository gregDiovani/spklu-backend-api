import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthService } from "./modules/auth/auth.service";
import { MerchantRepository } from "./modules/merchant/merchant.repository";
import { MerchantService } from "./modules/merchant/merchant.service";
import { TransactionRepository } from "./modules/transaction/transaction.repository";
import { PaymentService } from "./modules/transaction/transaction.service";
import { PaymentProvider } from "./modules/transaction/transaction.provider";
import { UserRepository } from "./modules/user/user.repository";
import { UserService } from "./modules/user/user.service";
import { MerchantSecretService } from "./modules/merchantkey/merchantSecretService";
import { PostgresMerchantSecretRepository } from "./modules/merchantkey/merchantkeyrepository";
import { PortfolioRepository } from "./modules/gregorio/portfolio.repository";
import { db, dbPostgreSQL } from "./config/db";
import { PortfolioService } from "./modules/gregorio/portfolio.service";
import { FileService } from "./modules/gregorio/file.sertvice";

const authRepo = new AuthRepository();
export const authService = new AuthService(authRepo);

const secretRepo = new PostgresMerchantSecretRepository()
const secretService = new MerchantSecretService(secretRepo)
const merchantRepo = new MerchantRepository();
export const merchantService = new MerchantService(merchantRepo,secretService);


const portofolioRepo = new PortfolioRepository(dbPostgreSQL)

export const portfolioService = new PortfolioService(portofolioRepo);


export const portfolioFileService = new FileService();


const payRepo = new TransactionRepository();
const paymentProvider = new PaymentProvider();

export const paymentService = new PaymentService(payRepo, paymentProvider);


const userRepo = new UserRepository()
export const userService = new UserService(userRepo);

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

const authRepo = new AuthRepository();
export const authService = new AuthService(authRepo);

const secretRepo = new PostgresMerchantSecretRepository()
const secretService = new MerchantSecretService(secretRepo)
const merchantRepo = new MerchantRepository();
export const merchantService = new MerchantService(merchantRepo,secretService);



const payRepo = new TransactionRepository();
const paymentProvider = new PaymentProvider();

export const paymentService = new PaymentService(payRepo, paymentProvider);


const userRepo = new UserRepository()

export const userService = new UserService(userRepo);

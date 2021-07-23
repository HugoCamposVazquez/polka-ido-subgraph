import { Address, BigInt } from "@graphprotocol/graph-ts";

import {
  CreatedSaleContract
} from "./types/SaleContractFactory/SaleContractFactory"
import {
  BuyTokens,
  Claim,
  SaleContract,
  SaleUpdated
} from "./types/SaleContract/SaleContract"
import {
  Allocation,
  Platform,
  Sale,
  Token,
  User,
  TokenClaim
} from "./types/schema";

export function handleCreatedSaleContract(event: CreatedSaleContract): void {
  let platform = Platform.load("platform");
  if (platform == null) {
    platform = new Platform("platform");
    platform.fundsRaised = new BigInt(0);
    platform.numOfUsers = 0;
    platform.numOfProjects = 0;
  }

  const sale = new Sale(event.params.tokenSaleAddress.toHexString());
  const contract = SaleContract.bind(event.params.tokenSaleAddress);

  sale.endDate = contract.endTime();
  sale.startDate = contract.startTime();
  sale.salePrice = contract.salePrice();
  sale.whitelisted = contract.whitelist();
  sale.metadataURI = contract.metadataURI();
  sale.maxDepositAmount = contract.maxDepositAmount();
  sale.currentDepositAmount = contract.currentDeposit();

  let token = Token.load(event.params.token.tokenID.toString());
  if (token == null) {
    token = new Token(event.params.token.tokenID.toString());
    token.decimals = event.params.token.decimals;
    token.save();
  }
  sale.token = token.id;

  platform.numOfProjects += 1;

  platform.save();
  sale.save();
  token.save();
}

export function handleBuyTokens(event: BuyTokens): void {
  const platform = Platform.load("platform");

  const sale = Sale.load(event.transaction.to.toHexString());
  if (sale == null) {
    return;
  }

  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    platform.numOfUsers += 1;
  }

  const allocation = new Allocation(event.transaction.hash.toHexString());
  allocation.amount = event.params.amount;
  allocation.sale = sale.id;
  allocation.user = user.id;

  platform.fundsRaised = platform.fundsRaised.plus(allocation.amount);

  platform.save();
  allocation.save();
  user.save();
}

export function handleClaim(event: Claim): void {
  const sale = Sale.load(event.transaction.to.toHexString());
  if (sale == null) {
    return;
  }

  const user = User.load(event.transaction.from.toHexString());
  const claim = new TokenClaim(event.transaction.hash.toHexString());

  claim.user = user.id;
  claim.statemintReceiver = event.params.statemintReceiver;
  claim.amount = event.params.amount;
  claim.token = event.params.token.tokenID.toString();

  claim.save()
}

export function handleSaleUpdate(event: SaleUpdated): void {
  const sale = Sale.load(event.transaction.to.toHexString());
  if (sale == null) {
    return;
  }

  const contract = SaleContract.bind(event.transaction.to as Address);

  sale.endDate = contract.endTime();
  sale.startDate = contract.startTime();
  sale.salePrice = contract.salePrice();
  sale.whitelisted = contract.whitelist();
  sale.metadataURI = contract.metadataURI();
  sale.maxDepositAmount = contract.maxDepositAmount();
  sale.currentDepositAmount = contract.currentDeposit();

  sale.save();
}

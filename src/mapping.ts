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

  const salePriceCall = contract.try_salePrice();
  if (!salePriceCall.reverted) {
    sale.salePrice = salePriceCall.value;
  }
  const whitelistCall = contract.try_whitelist();
  if (!whitelistCall.reverted) {
    sale.whitelisted = whitelistCall.value;
  }
  const metadataCall = contract.try_metadataURI();
  if (!metadataCall.reverted) {
    sale.metadataURI = metadataCall.value;
  }
  const maxDepositAmountCall = contract.try_maxDepositAmount();
  if (!maxDepositAmountCall.reverted) {
    sale.maxDepositAmount = maxDepositAmountCall.value;
  }
  const currentDepositAmountCall = contract.try_currentDeposit();
  if (!currentDepositAmountCall.reverted) {
    sale.currentDepositAmount = currentDepositAmountCall.value;
  }
  const featuredCall = contract.try_isFeatured();
  if (!featuredCall.reverted) {
    sale.featured = featuredCall.value;
  }
  const startDateCall = contract.try_startTime();
  if (!startDateCall.reverted) {
    sale.startDate = startDateCall.value;
  }
  const endDateCall = contract.try_endTime();
  if (!endDateCall.reverted) {
    sale.endDate = endDateCall.value;
  }

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
  sale.currentDepositAmount = sale.currentDepositAmount.plus(allocation.amount);

  sale.save();
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
  const salePriceCall = contract.try_salePrice();
  if (!salePriceCall.reverted) {
    sale.salePrice = salePriceCall.value;
  }
  const whitelistCall = contract.try_whitelist();
  if (!whitelistCall.reverted) {
    sale.whitelisted = whitelistCall.value;
  }
  const metadataCall = contract.try_metadataURI();
  if (!metadataCall.reverted) {
    sale.metadataURI = metadataCall.value;
  }
  const maxDepositAmountCall = contract.try_maxDepositAmount();
  if (!maxDepositAmountCall.reverted) {
    sale.maxDepositAmount = maxDepositAmountCall.value;
  }
  const featuredCall = contract.try_isFeatured();
  if (!featuredCall.reverted) {
    sale.featured = featuredCall.value;
  }
  const startDateCall = contract.try_startTime();
  if (!startDateCall.reverted) {
    sale.startDate = startDateCall.value;
  }
  const endDateCall = contract.try_endTime();
  if (!endDateCall.reverted) {
    sale.endDate = endDateCall.value;
  }

  sale.save();
}

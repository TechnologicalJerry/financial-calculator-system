import { getPrismaClient } from '@packages/database';
import { Prisma, AssetType, SecurityStatus } from '@prisma/client';
import { toDecimal } from '@packages/calculators';

export interface CreateSecurityData {
  symbol: string;
  name: string;
  assetType?: AssetType | undefined;
  exchange?: string | undefined;
  currency?: string | undefined;
  isin?: string | undefined;
  cusip?: string | undefined;
  status?: SecurityStatus | undefined;
}

export interface FindSecuritiesOptions {
  page: number;
  limit: number;
  assetType?: AssetType | undefined;
  search?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountSecuritiesOptions {
  assetType?: AssetType | undefined;
  search?: string | undefined;
}

export class SecurityRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createSecurity(data: CreateSecurityData) {
    return this.prisma.security.create({
      data: {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        assetType: data.assetType || 'STOCK',
        exchange: data.exchange || null,
        currency: (data.currency || 'USD').toUpperCase(),
        isin: data.isin || null,
        cusip: data.cusip || null,
        status: data.status || 'ACTIVE',
      },
    });
  }

  public async findSecurityById(id: string) {
    return this.prisma.security.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { priceDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  public async findSecurityBySymbol(symbol: string) {
    return this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        prices: {
          orderBy: { priceDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  public async findSecurities(options: FindSecuritiesOptions) {
    const where: Prisma.SecurityWhereInput = {};
    if (options.assetType) where.assetType = options.assetType;
    if (options.search) {
      where.OR = [
        { symbol: { contains: options.search.toUpperCase() } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.security.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: {
        prices: {
          orderBy: { priceDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  public async countSecurities(options: CountSecuritiesOptions) {
    const where: Prisma.SecurityWhereInput = {};
    if (options.assetType) where.assetType = options.assetType;
    if (options.search) {
      where.OR = [
        { symbol: { contains: options.search.toUpperCase() } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.security.count({ where });
  }

  public async addSecurityPrice(
    securityId: string,
    price: string | number,
    currency = 'USD',
    priceDate?: Date,
    source = 'MANUAL',
  ) {
    return this.prisma.securityPrice.create({
      data: {
        securityId,
        price: new Prisma.Decimal(toDecimal(price).toString()),
        currency: currency.toUpperCase(),
        priceDate: priceDate || new Date(),
        source,
      },
    });
  }

  public async getLatestPriceForSecurity(securityId: string) {
    return this.prisma.securityPrice.findFirst({
      where: { securityId },
      orderBy: { priceDate: 'desc' },
    });
  }
}

export const securityRepository = new SecurityRepository();

import { NotFoundError, ValidationError, ConflictError } from '@packages/errors';
import { securityRepository, SecurityRepository } from '../repositories/security.repository.js';
import {
  createSecuritySchema,
  securityQuerySchema,
  createSecurityPriceSchema,
} from '../schemas/investment.schemas.js';

export class SecurityService {
  constructor(private repository: SecurityRepository = securityRepository) {}

  public async createSecurity(rawInput: unknown) {
    const parse = createSecuritySchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid security parameters', parse.error.errors);
    }
    const data = parse.data;

    const existing = await this.repository.findSecurityBySymbol(data.symbol);
    if (existing) {
      throw new ConflictError(`Security with symbol '${data.symbol}' already exists`);
    }

    return this.repository.createSecurity({
      symbol: data.symbol,
      name: data.name,
      assetType: data.assetType,
      exchange: data.exchange,
      currency: data.currency,
      isin: data.isin,
      cusip: data.cusip,
      status: data.status,
    });
  }

  public async listSecurities(rawQuery: unknown) {
    const parse = securityQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid security query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findSecurities(query),
      this.repository.countSecurities(query),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  public async getSecurityDetail(id: string) {
    const security = await this.repository.findSecurityById(id);
    if (!security) {
      const bySymbol = await this.repository.findSecurityBySymbol(id);
      if (!bySymbol) {
        throw new NotFoundError(`Security '${id}' not found`);
      }
      return bySymbol;
    }
    return security;
  }

  public async addSecurityPrice(securityId: string, rawInput: unknown) {
    const security = await this.getSecurityDetail(securityId);

    const parse = createSecurityPriceSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid price parameters', parse.error.errors);
    }
    const data = parse.data;

    return this.repository.addSecurityPrice(
      security.id,
      data.price,
      data.currency || security.currency,
      data.priceDate ? new Date(data.priceDate) : new Date(),
      data.source,
    );
  }
}

export const securityService = new SecurityService();

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Global Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global cross-domain search' })
  search(@Query('q') query: string, @CurrentUser('userId') userId: string) {
    return this.searchService.globalSearch(query || '', userId);
  }

  @Get('autocomplete')
  autocomplete(@Query('q') query: string, @CurrentUser('userId') userId: string) {
    return this.searchService.globalSearch(query || '', userId);
  }
}

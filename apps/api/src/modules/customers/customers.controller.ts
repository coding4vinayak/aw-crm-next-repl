import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrganizationGuard } from '../../common/guards/organization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@awcrm/database';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, OrganizationGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Customer with this email already exists',
  })
  async create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(
      req.user.organizationId,
      req.user.id,
      createCustomerDto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all customers with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customers retrieved successfully',
  })
  async findAll(@Request() req, @Query() filters: CustomerFiltersDto) {
    return this.customersService.findAll(req.user.organizationId, filters);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer statistics retrieved successfully',
  })
  async getStats(@Request() req) {
    return this.customersService.getCustomerStats(req.user.organizationId);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Search customers' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.searchCustomers(
      req.user.organizationId,
      query,
      limit ? parseInt(limit.toString()) : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findOne(req.user.organizationId, id);
  }

  @Get(':id/activities')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get customer activities' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer activities retrieved successfully',
  })
  async getActivities(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerActivities(
      req.user.organizationId,
      id,
      page ? parseInt(page.toString()) : undefined,
      limit ? parseInt(limit.toString()) : undefined,
    );
  }

  @Get(':id/deals')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get customer deals' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer deals retrieved successfully',
  })
  async getDeals(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerDeals(
      req.user.organizationId,
      id,
      page ? parseInt(page.toString()) : undefined,
      limit ? parseInt(limit.toString()) : undefined,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Customer with this email already exists',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      req.user.organizationId,
      id,
      req.user.id,
      updateCustomerDto,
    );
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign customer to a user' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer assigned successfully',
  })
  async assign(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignedToId', ParseUUIDPipe) assignedToId: string,
  ) {
    return this.customersService.assignCustomer(
      req.user.organizationId,
      id,
      assignedToId,
      req.user.id,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Update customer status' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer status updated successfully',
  })
  async updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.customersService.updateCustomerStatus(
      req.user.organizationId,
      id,
      status,
      req.user.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.customersService.remove(req.user.organizationId, id, req.user.id);
    return { message: 'Customer deleted successfully' };
  }

  @Post('bulk/create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk create customers' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk create completed',
  })
  async bulkCreate(
    @Request() req,
    @Body() customers: CreateCustomerDto[],
  ) {
    return this.customersService.bulkCreate(
      req.user.organizationId,
      req.user.id,
      customers,
    );
  }

  @Patch('bulk/update')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk update customers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed',
  })
  async bulkUpdate(
    @Request() req,
    @Body() updates: Array<{ id: string; data: UpdateCustomerDto }>,
  ) {
    return this.customersService.bulkUpdate(
      req.user.organizationId,
      req.user.id,
      updates,
    );
  }

  @Delete('bulk/delete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk delete customers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk delete completed',
  })
  async bulkDelete(
    @Request() req,
    @Body('ids') ids: string[],
  ) {
    return this.customersService.bulkDelete(
      req.user.organizationId,
      req.user.id,
      ids,
    );
  }
}
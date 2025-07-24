import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
import { Customer, CustomerWithRelations, PaginatedResponse } from '@awcrm/database';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerWithRelations> {
    this.logger.log(`Creating customer for organization ${organizationId}`);

    // Check if customer with email already exists in organization
    const existingCustomer = await this.customersRepository.findByEmail(
      organizationId,
      createCustomerDto.email,
    );

    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = await this.customersRepository.create(organizationId, {
      ...createCustomerDto,
      assignedToId: createCustomerDto.assignedToId || userId,
    });

    // Emit domain event
    this.eventEmitter.emit('customer.created', {
      customerId: customer.id,
      organizationId,
      userId,
      customer,
    });

    // Log audit event
    await this.auditService.log({
      action: 'create',
      entityType: 'customer',
      entityId: customer.id,
      userId,
      organizationId,
      newValues: customer,
    });

    this.logger.log(`Customer ${customer.id} created successfully`);
    return customer;
  }

  async findAll(
    organizationId: string,
    filters: CustomerFiltersDto,
  ): Promise<PaginatedResponse<CustomerWithRelations>> {
    this.logger.log(`Fetching customers for organization ${organizationId}`);
    return this.customersRepository.findMany(organizationId, filters);
  }

  async findOne(organizationId: string, id: string): Promise<CustomerWithRelations> {
    this.logger.log(`Fetching customer ${id} for organization ${organizationId}`);
    
    const customer = await this.customersRepository.findById(organizationId, id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    organizationId: string,
    id: string,
    userId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerWithRelations> {
    this.logger.log(`Updating customer ${id} for organization ${organizationId}`);

    const existingCustomer = await this.findOne(organizationId, id);

    // Check if email is being changed and if it conflicts
    if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
      const customerWithEmail = await this.customersRepository.findByEmail(
        organizationId,
        updateCustomerDto.email,
      );

      if (customerWithEmail && customerWithEmail.id !== id) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    const updatedCustomer = await this.customersRepository.update(organizationId, id, updateCustomerDto);

    // Emit domain event
    this.eventEmitter.emit('customer.updated', {
      customerId: id,
      organizationId,
      userId,
      previousData: existingCustomer,
      updatedData: updatedCustomer,
    });

    // Log audit event
    await this.auditService.log({
      action: 'update',
      entityType: 'customer',
      entityId: id,
      userId,
      organizationId,
      oldValues: existingCustomer,
      newValues: updatedCustomer,
    });

    this.logger.log(`Customer ${id} updated successfully`);
    return updatedCustomer;
  }

  async remove(organizationId: string, id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting customer ${id} for organization ${organizationId}`);

    const customer = await this.findOne(organizationId, id);

    await this.customersRepository.delete(organizationId, id);

    // Emit domain event
    this.eventEmitter.emit('customer.deleted', {
      customerId: id,
      organizationId,
      userId,
      customer,
    });

    // Log audit event
    await this.auditService.log({
      action: 'delete',
      entityType: 'customer',
      entityId: id,
      userId,
      organizationId,
      oldValues: customer,
    });

    this.logger.log(`Customer ${id} deleted successfully`);
  }

  async bulkCreate(
    organizationId: string,
    userId: string,
    customers: CreateCustomerDto[],
  ): Promise<{ created: CustomerWithRelations[]; errors: any[] }> {
    this.logger.log(`Bulk creating ${customers.length} customers for organization ${organizationId}`);

    const created: CustomerWithRelations[] = [];
    const errors: any[] = [];

    for (const [index, customerDto] of customers.entries()) {
      try {
        const customer = await this.create(organizationId, userId, customerDto);
        created.push(customer);
      } catch (error) {
        errors.push({
          index,
          email: customerDto.email,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk create completed: ${created.length} created, ${errors.length} errors`);
    return { created, errors };
  }

  async bulkUpdate(
    organizationId: string,
    userId: string,
    updates: Array<{ id: string; data: UpdateCustomerDto }>,
  ): Promise<{ updated: CustomerWithRelations[]; errors: any[] }> {
    this.logger.log(`Bulk updating ${updates.length} customers for organization ${organizationId}`);

    const updated: CustomerWithRelations[] = [];
    const errors: any[] = [];

    for (const { id, data } of updates) {
      try {
        const customer = await this.update(organizationId, id, userId, data);
        updated.push(customer);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk update completed: ${updated.length} updated, ${errors.length} errors`);
    return { updated, errors };
  }

  async bulkDelete(
    organizationId: string,
    userId: string,
    ids: string[],
  ): Promise<{ deleted: number; errors: any[] }> {
    this.logger.log(`Bulk deleting ${ids.length} customers for organization ${organizationId}`);

    let deleted = 0;
    const errors: any[] = [];

    for (const id of ids) {
      try {
        await this.remove(organizationId, id, userId);
        deleted++;
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk delete completed: ${deleted} deleted, ${errors.length} errors`);
    return { deleted, errors };
  }

  async getCustomerStats(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    prospects: number;
    totalValue: number;
    averageValue: number;
  }> {
    this.logger.log(`Getting customer stats for organization ${organizationId}`);
    return this.customersRepository.getStats(organizationId);
  }

  async searchCustomers(
    organizationId: string,
    query: string,
    limit: number = 10,
  ): Promise<CustomerWithRelations[]> {
    this.logger.log(`Searching customers with query "${query}" for organization ${organizationId}`);
    return this.customersRepository.search(organizationId, query, limit);
  }

  async getCustomerActivities(
    organizationId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    this.logger.log(`Getting activities for customer ${customerId} in organization ${organizationId}`);
    
    const customer = await this.findOne(organizationId, customerId);
    return this.customersRepository.getActivities(organizationId, customerId, page, limit);
  }

  async getCustomerDeals(
    organizationId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    this.logger.log(`Getting deals for customer ${customerId} in organization ${organizationId}`);
    
    const customer = await this.findOne(organizationId, customerId);
    return this.customersRepository.getDeals(organizationId, customerId, page, limit);
  }

  async assignCustomer(
    organizationId: string,
    customerId: string,
    assignedToId: string,
    userId: string,
  ): Promise<CustomerWithRelations> {
    this.logger.log(`Assigning customer ${customerId} to user ${assignedToId}`);

    const customer = await this.update(organizationId, customerId, userId, {
      assignedToId,
    });

    // Emit domain event
    this.eventEmitter.emit('customer.assigned', {
      customerId,
      organizationId,
      assignedToId,
      assignedBy: userId,
    });

    return customer;
  }

  async updateCustomerStatus(
    organizationId: string,
    customerId: string,
    status: string,
    userId: string,
  ): Promise<CustomerWithRelations> {
    this.logger.log(`Updating customer ${customerId} status to ${status}`);

    const customer = await this.update(organizationId, customerId, userId, {
      status,
    });

    // Emit domain event
    this.eventEmitter.emit('customer.status_changed', {
      customerId,
      organizationId,
      status,
      userId,
    });

    return customer;
  }
}
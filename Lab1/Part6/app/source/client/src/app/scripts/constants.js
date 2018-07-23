'use strict';

/**
 * @ngdoc overview
 * @name constants
 * @description
 * # constants
 *
 * Main module of the application.
 */
angular.module('clientApp')
  .constant('Constants', {
    // AUTH_MANAGER_URL: 'http://localhost:3000',
    // USER_MANAGER_URL: 'http://localhost:3001',
    // TENANT_MANAGER_URL: 'http://localhost:3003',
    // TENANT_REGISTRATION_URL: 'http://localhost:3004',
    // PRODUCT_MANAGER_URL: 'http://localhost:3006',
    // ORDER_MANAGER_URL: 'http://localhost:3015',
    // SYSTEM_REGISTRATION_URL: 'http://localhost:3011',

    AUTH_MANAGER_URL: 'https://DOMAIN_URL',
    USER_MANAGER_URL: 'https://DOMAIN_URL',
    TENANT_MANAGER_URL: 'https://DOMAIN_URL',
    TENANT_REGISTRATION_URL: 'https://DOMAIN_URL',
    PRODUCT_MANAGER_URL: 'https://DOMAIN_URL',
    ORDER_MANAGER_URL: 'https://DOMAIN_URL',
    SYSTEM_REGISTRATION_URL: 'https://DOMAIN_URL',

    SYSTEM_ADMIN_ROLE: 'SystemAdmin',
    SYSTEM_SUPPORT_ROLE: 'SystemUser',
    TENANT_ADMIN_ROLE: 'TenantAdmin',
    TENANT_USER_ROLE: 'TenantUser'
  });

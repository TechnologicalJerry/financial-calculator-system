import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController, UsersController } from './user.controller.js';
import { UserProfileController } from './user-profile.controller.js';
import { UserSettingsController } from './user-settings.controller.js';
import { UserPreferencesController } from './user-preferences.controller.js';
import { UserAddressController } from './user-address.controller.js';
import { PrivacySettingsController } from './privacy-settings.controller.js';
import { NotificationPreferencesController } from './notification-preferences.controller.js';
import { DeviceManagementController } from './device-management.controller.js';

@Module({
  controllers: [
    UsersController,
    UserController,
    UserProfileController,
    UserSettingsController,
    UserPreferencesController,
    UserAddressController,
    PrivacySettingsController,
    NotificationPreferencesController,
    DeviceManagementController,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

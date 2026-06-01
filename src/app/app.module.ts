// File: src/app/app.module.ts
/**
 * NOTE: This application primarily uses Standalone Components and bootstrapApplication.
 * This AppModule serves as a reference for Phase 9 requirements but is not the 
 * primary entry point for bootstrapping in modern Angular 17+ projects.
 */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// Material Imports
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppComponent } from './app.component';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    
    // Material
    MatInputModule, MatButtonModule, MatCardModule, MatSelectModule,
    MatRadioModule, MatTableModule, MatPaginatorModule, MatChipsModule,
    MatIconModule, MatBadgeModule, MatProgressBarModule, MatBottomSheetModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatSidenavModule,
    MatTabsModule, MatExpansionModule, MatListModule, MatMenuModule,
    MatSlideToggleModule, MatProgressSpinnerModule
  ],
  providers: [
    // Note: authInterceptor is functional in this project, but for classical CJS injection:
    // { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

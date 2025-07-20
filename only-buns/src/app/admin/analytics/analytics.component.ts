import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, NgIf } from '@angular/common';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { ViewChild, ElementRef } from '@angular/core';

import {
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  Title
} from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, Title);


interface UserActivityBreakdownDTO {
  percentWithPosts: number;
  percentWithOnlyComments: number;
  percentInactive: number;
}


@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  imports: [DecimalPipe, NgIf],
  standalone: true
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('radialChartCanvas', { static: false }) radialChartCanvas!: ElementRef<HTMLCanvasElement>;

  postsWeekly: number | null = null;
  postsMonthly: number | null = null;
  postsYearly: number | null = null;
  
  commentsWeekly: number | null = null;
  commentsMonthly: number | null = null;
  commentsYearly: number | null = null;

  private radialChart: Chart | null = null;

  userActivity: UserActivityBreakdownDTO | null = null;

  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('analytics');
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.loading = true;
    this.error = null;
  
    try {
      const periods = ['weekly', 'monthly', 'yearly'] as const;
  
      const postsPromises = periods.map(period =>
        this.http.get<number>(`http://localhost:8080/api/analytics/post-count?period=${period}`).toPromise()
      );
      const commentsPromises = periods.map(period =>
        this.http.get<number>(`http://localhost:8080/api/analytics/comment-count?period=${period}`).toPromise()
      );
      const userActivityPromise = this.http.get<UserActivityBreakdownDTO>(`http://localhost:8080/api/analytics/user-activity-breakdown`).toPromise();
  
      // Ovde eksplicitno tipiziramo da je results tuple sa 7 elemenata:
      const results = await Promise.all([
        ...postsPromises,
        ...commentsPromises,
        userActivityPromise
      ]) as [
        number, number, number,    // posts weekly, monthly, yearly
        number, number, number,    // comments weekly, monthly, yearly
        UserActivityBreakdownDTO   // user activity
      ];

      console.log('results:', results);
  
      this.postsWeekly = results[0] ?? null;
      this.postsMonthly = results[1] ?? null;
      this.postsYearly = results[2] ?? null;
  
      this.commentsWeekly = results[3] ?? null;
      this.commentsMonthly = results[4] ?? null;
      this.commentsYearly = results[5] ?? null;
  
      this.userActivity = results[6] ?? null;

        
      if (this.userActivity) {
        setTimeout(() => this.renderRadialChart(), 0); // možeš i bez setTimeout ako koristiš *ngIf
      }
    } catch (err) {
      this.error = 'Greška pri učitavanju podataka';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }



  renderRadialChart(): void {
    if (!this.userActivity || !this.radialChartCanvas) return;
  
    const data: ChartData<'doughnut'> = {
      labels: ['Posts', 'Only Comments', 'No Activity'],
      datasets: [{
        data: [
          this.userActivity.percentWithPosts,
          this.userActivity.percentWithOnlyComments,
          this.userActivity.percentInactive
        ],
        backgroundColor: ['#3b82f6', '#f97316', '#9ca3af'],
        hoverOffset: 30
      }]
    };
  
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: context => {
                const label = context.label || '';
                const value = context.parsed;
                return `${label}: ${value.toFixed(2)}%`;
              }
            }
          }
        }
      }
    };
  
    // Uništi prethodni graf ako postoji
    if (this.radialChart) {
      this.radialChart.destroy();
    }
  
    const canvas = this.radialChartCanvas.nativeElement;
    this.radialChart = new Chart(canvas, config);
  }

  ngOnDestroy(): void {
    if (this.radialChart) {
      this.radialChart.destroy();
    }
  }
}
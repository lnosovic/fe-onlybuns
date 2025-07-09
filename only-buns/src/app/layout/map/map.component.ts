import { Component,Output,EventEmitter,Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location } from '../../post/models/location.model';
@Component({
  selector: 'app-map',
  standalone:true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnChanges {
  private map: any;
   private currentMarker: L.Marker | null = null;
  @Output() mapClick = new EventEmitter<{ lat: number, lng: number }>();
  @Output() locationSelected = new EventEmitter<Location>();
  @Input() longitude? : number;
  @Input() latitude? : number;
  @Input() reset: boolean = false;
  location: Location | null = null;
  address: string = '';
  constructor(private http: HttpClient) {}

  private initMap(): void {
    this.map = L.map('map', {
      center: [45.2396, 19.8227],
      zoom: 13,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);
    this.registerOnClick();
  }

  ngAfterViewInit(): void {
    let DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon.png',
    });
    L.Marker.prototype.options.icon = DefaultIcon;
    this.initMap();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reset'] && changes['reset'].currentValue === true) {
      this.clearMarker();
    }
  }

  registerOnClick(): void {
    this.map.on('click', (e: any) => {
      if (this.currentMarker) {
        this.map.removeLayer(this.currentMarker);
      }
      const coord = e.latlng;
      this.latitude = coord.lat;
      this.longitude = coord.lng;
      console.log(
        'You clicked the map at latitude: ' + coord.lat + ' and longitude: ' + coord.lng
      );
      this.currentMarker=new L.Marker([coord.lat, coord.lng]).addTo(this.map);
      this.reverseSearch(coord.lat, coord.lng).subscribe({
      next: (result) => {
        const address = result?.address;
        this.location = {
          id: 0,
          latitude: coord.lat,
          longitude: coord.lng,
          country: address?.country || 'Unknown',
          city: address?.city || address?.town || address?.village || 'Unknown',
        };
        this.locationSelected.emit(this.location);  // <-- emit the full location
        console.log('Selected location:', this.location);
      },
      error: () => {
        this.address = 'Failed to fetch address';
        this.location = null;
      }
    });
    });
  }
  clearMarker(): void {
    if (this.currentMarker && this.map) {
      this.map.removeLayer(this.currentMarker);
      this.currentMarker = null;
      this.location = null;
    }
  }
  reverseSearch(lat: number, lon: number): Observable<any> {
    return this.http.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    );
  }
}
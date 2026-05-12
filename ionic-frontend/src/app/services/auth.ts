import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from "../models/interfaces";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';

  constructor(private http: HttpClient){};

  login(credentials: {email: string, password: string}):Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials);
  }
}

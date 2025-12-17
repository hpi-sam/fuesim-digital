import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { User } from "digital-fuesim-manv-shared";
import { HttpClient } from "@angular/common/http";


@Injectable({
    providedIn: "root"
})
export class AuthService {
    private user$ = new BehaviorSubject<User | null>(null);

    private userData$ = this.user$.asObservable();

    constructor(private readonly httpClient: HttpClient) {}

    public async fetchUserData(){
        this.httpClient.get("/api/auth/user-data")
    }
}

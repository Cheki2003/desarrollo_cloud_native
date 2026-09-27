import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Pedido {
    id?: number;
    producto: string;
    cantidad: number;
    precio: number;
    estado: string;
    direccion: string;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
    private apiUrl = 'https://qftpn0meq9.execute-api.us-east-1.amazonaws.com/api/pedidos';

    constructor(private http: HttpClient) {}

    obtenerPedidos(): Observable<Pedido[]> {
        return this.http.get<Pedido[]>(this.apiUrl);
    }

    obtenerPedidoPorId(id: number): Observable<Pedido> {
        return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
    }

    buscarPorEstado(estado: string): Observable<Pedido[]> {
        return this.http.get<Pedido[]>(`${this.apiUrl}/buscar?estado=${estado}`);
    }

    crearPedido(pedido: Pedido): Observable<Pedido> {
        return this.http.post<Pedido>(this.apiUrl, pedido);
    }

    actualizarPedido(id: number, pedido: Pedido): Observable<Pedido> {
        return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido);
    }

    eliminarPedido(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
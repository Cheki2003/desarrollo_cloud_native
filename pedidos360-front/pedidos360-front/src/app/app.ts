import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  signInWithRedirect,
  signOut,
  fetchAuthSession,
  getCurrentUser
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { Pedido, PedidosService } from './pedidos.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  protected readonly title = signal('pedidos360-front');
  usuario = '';
  token = '';
  autenticado = false;
  iniciandoSesion = false;
  errorInicioSesion = '';
  pedidos: any[] = [];
  cargandoPedidos = false;
  errorPedidos = '';
  datosConsultados = false;
  estadoFiltro = '';
  detallePedido: Pedido | null = null;
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  guardandoPedido = false;
  mensaje = '';
  formulario: Pedido = this.crearPedidoVacio();

  constructor(private pedidosService: PedidosService) {
    const stopListening = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'tokenRefresh') {
        void this.ngZone.run(() => this.verSesion());
      }

      if (payload.event === 'signedOut') {
        this.ngZone.run(() => {
          this.limpiarSesion();
          this.actualizarVista();
        });
      }
    });

    this.destroyRef.onDestroy(stopListening);
  }

  async ngOnInit() {
    await this.verSesion();
  }

  async login() {
    this.iniciandoSesion = true;
    this.errorInicioSesion = '';

    try {
      // Cognito throws UserAlreadyAuthenticatedException if it is redirected twice.
      await getCurrentUser();
      await this.verSesion();
      this.iniciandoSesion = false;
      return;
    } catch {
      // There is no local session, so redirect to Cognito Hosted UI.
    }

    try {
      await signInWithRedirect();
    } catch (error) {
      console.error('Error al redirigir al login:', error);
      this.ngZone.run(() => {
        this.errorInicioSesion = error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión. Revisa la configuración de Cognito.';
        this.iniciandoSesion = false;
        this.actualizarVista();
      });
    }
  }

  async logout() {
    await signOut();
    this.limpiarSesion();
    this.actualizarVista();
  }

  async verSesion() {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      this.ngZone.run(() => {
        this.usuario = user.username;
        this.token = session.tokens?.accessToken?.toString() ?? '';
        this.autenticado = true;

        console.log('Usuario:', user);
        console.log('Access Token (JWT con token_use: access):', this.token);

        this.actualizarVista();
      });
    } catch (error) {
      console.log('No existe sesión', error);
      this.ngZone.run(() => {
        this.limpiarSesion();
        this.actualizarVista();
      });
    }
  }

  private limpiarSesion() {
    this.autenticado = false;
    this.usuario = '';
    this.token = '';
    this.pedidos = [];
    this.errorPedidos = '';
    this.cargandoPedidos = false;
    this.datosConsultados = false;
    this.detallePedido = null;
    this.mostrarFormulario = false;
    this.mensaje = '';
  }

  private actualizarVista() {
    this.changeDetectorRef.detectChanges();
  }

  consultarPedidos() {
    this.prepararConsulta();

    this.pedidosService.obtenerPedidos().subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
        this.pedidos = data;
        this.cargandoPedidos = false;
        this.datosConsultados = true;
        this.detallePedido = null;
          this.actualizarVista();
        });
      },
      error: (error: any) => {
        this.mostrarError(error);
      }
    });
  }

  eliminar(id: number) {
    if(confirm('¿Estás seguro de eliminar el pedido #' + id + '?')) {
      this.pedidosService.eliminarPedido(id).subscribe({
        next: () => {
          this.mensaje = `Pedido #${id} eliminado.`;
          this.detallePedido = null;
          this.consultarPedidos(); // Refrescar tabla
        },
        error: (err: any) => {
          console.error('Error al eliminar', err);
          alert('Hubo un error al eliminar el pedido.');
        }
      });
    }
  }

  buscarPedidos() {
    if (!this.estadoFiltro) {
      this.consultarPedidos();
      return;
    }

    this.prepararConsulta();
    this.pedidosService.buscarPorEstado(this.estadoFiltro).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.pedidos = data;
          this.cargandoPedidos = false;
          this.datosConsultados = true;
          this.detallePedido = null;
          this.mensaje = `Mostrando pedidos en estado ${this.estadoFiltro}.`;
          this.actualizarVista();
        });
      },
      error: (error) => this.mostrarError(error)
    });
  }

  limpiarFiltro() {
    this.estadoFiltro = '';
    this.consultarPedidos();
  }

  verDetalle(id: number) {
    this.pedidosService.obtenerPedidoPorId(id).subscribe({
      next: (pedido) => {
        this.ngZone.run(() => {
          this.detallePedido = pedido;
          this.mostrarFormulario = false;
          this.actualizarVista();
        });
      },
      error: (error) => this.mostrarError(error)
    });
  }

  abrirCrearPedido() {
    this.modoFormulario = 'crear';
    this.formulario = this.crearPedidoVacio();
    this.detallePedido = null;
    this.mostrarFormulario = true;
  }

  abrirEditarPedido(pedido: Pedido) {
    this.modoFormulario = 'editar';
    this.formulario = { ...pedido };
    this.detallePedido = null;
    this.mostrarFormulario = true;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.formulario = this.crearPedidoVacio();
  }

  guardarPedido() {
    this.guardandoPedido = true;
    this.errorPedidos = '';

    const solicitud = this.modoFormulario === 'crear'
      ? this.pedidosService.crearPedido(this.formulario)
      : this.pedidosService.actualizarPedido(this.formulario.id!, this.formulario);

    solicitud.subscribe({
      next: (pedido) => {
        this.ngZone.run(() => {
          this.guardandoPedido = false;
          this.mostrarFormulario = false;
          this.mensaje = this.modoFormulario === 'crear'
            ? `Pedido #${pedido.id} creado.`
            : `Pedido #${pedido.id} actualizado.`;
          this.consultarPedidos();
          this.actualizarVista();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.guardandoPedido = false;
          this.mostrarError(error);
        });
      }
    });
  }

  private prepararConsulta() {
    this.ngZone.run(() => {
      this.cargandoPedidos = true;
      this.errorPedidos = '';
      this.mensaje = '';
      this.detallePedido = null;
      this.actualizarVista();
    });
  }

  private mostrarError(error: any) {
    this.ngZone.run(() => {
      console.error('Error al consultar la API:', error);
      this.errorPedidos = 'No fue posible completar la operación (HTTP ' + error.status + ')';
      this.cargandoPedidos = false;
      this.actualizarVista();
    });
  }

  private crearPedidoVacio(): Pedido {
    return {
      producto: '',
      cantidad: 1,
      precio: 0,
      estado: 'RECIBIDO',
      direccion: ''
    };
  }
}

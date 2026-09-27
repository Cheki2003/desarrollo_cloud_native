package cl.duoc.pedidos360_backend.controller;

import cl.duoc.pedidos360_backend.model.Pedido;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pedidos")
public class PedidosController {

    private final List<Pedido> pedidos = new CopyOnWriteArrayList<>();
    private final AtomicLong counter = new AtomicLong();

    public PedidosController() {
        pedidos.add(new Pedido(counter.incrementAndGet(), "Laptop Gamer", 1, 1500.00, "EN_CAMINO", "Av. Principal 123"));
        pedidos.add(new Pedido(counter.incrementAndGet(), "Monitor 4K", 2, 600.00, "RECIBIDO", "Calle Falsa 456"));
    }

    @GetMapping
    public List<Pedido> getAllPedidos() {
        return pedidos;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> getPedidoById(@PathVariable Long id) {
        Optional<Pedido> pedido = pedidos.stream().filter(p -> p.getId().equals(id)).findFirst();
        return pedido.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public List<Pedido> getPedidosByEstado(@RequestParam String estado) {
        return pedidos.stream()
                .filter(p -> p.getEstado().equalsIgnoreCase(estado))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Pedido> createPedido(@RequestBody Pedido pedido) {
        pedido.setId(counter.incrementAndGet());
        if (pedido.getEstado() == null || pedido.getEstado().isEmpty()) {
            pedido.setEstado("RECIBIDO");
        }
        pedidos.add(pedido);
        return new ResponseEntity<>(pedido, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pedido> updatePedido(@PathVariable Long id, @RequestBody Pedido updatedPedido) {
        for (int i = 0; i < pedidos.size(); i++) {
            if (pedidos.get(i).getId().equals(id)) {
                updatedPedido.setId(id);
                if (updatedPedido.getEstado() == null || updatedPedido.getEstado().isEmpty()) {
                    updatedPedido.setEstado(pedidos.get(i).getEstado());
                }
                pedidos.set(i, updatedPedido);
                return ResponseEntity.ok(updatedPedido);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePedido(@PathVariable Long id) {
        boolean removed = pedidos.removeIf(p -> p.getId().equals(id));
        if (removed) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

package cl.duoc.pedidos360_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/pedidos/**").hasAuthority("SCOPE_pedidos360-api/pedidos-api-read")
                .requestMatchers(HttpMethod.POST, "/api/pedidos/**").hasAuthority("SCOPE_pedidos360-api/pedidos-api-write")
                .requestMatchers(HttpMethod.PUT, "/api/pedidos/**").hasAuthority("SCOPE_pedidos360-api/pedidos-api-write")
                .requestMatchers(HttpMethod.DELETE, "/api/pedidos/**").hasAuthority("SCOPE_pedidos360-api/pedidos-api-write")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {})
            );
        
        return http.build();
    }
}

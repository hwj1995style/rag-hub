package com.example.kb.security;

import com.example.kb.entity.KbAdminUser;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class KbUserPrincipal implements UserDetails {

    private final String userId;
    private final String username;
    private final String password;
    private final String displayName;
    private final String roleCode;
    private final String status;
    private final List<GrantedAuthority> authorities;

    private KbUserPrincipal(KbAdminUser user) {
        this.userId = user.getId().toString();
        this.username = user.getUsername();
        this.password = user.getPasswordHash();
        this.displayName = user.getDisplayName();
        this.roleCode = user.getRoleCode();
        this.status = user.getStatus();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + normalizeRole(user.getRoleCode())));
    }

    public static KbUserPrincipal from(KbAdminUser user) {
        return new KbUserPrincipal(user);
    }

    private static String normalizeRole(String roleCode) {
        return roleCode == null ? "USER" : roleCode.trim().toUpperCase().replace('-', '_');
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRoleCode() {
        return roleCode;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "active".equalsIgnoreCase(status);
    }
}

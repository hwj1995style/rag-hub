package com.example.kb.service.impl;

import com.example.kb.entity.KbPermissionPolicy;
import com.example.kb.repository.KbPermissionPolicyRepository;
import com.example.kb.security.CurrentUserProvider;
import com.example.kb.security.KbUserPrincipal;
import com.example.kb.security.PermissionSubjectResolver;
import com.example.kb.service.DocumentAccessService;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class DocumentAccessServiceImpl implements DocumentAccessService {

    private final CurrentUserProvider currentUserProvider;
    private final PermissionSubjectResolver subjectResolver;
    private final KbPermissionPolicyRepository permissionPolicyRepository;

    public DocumentAccessServiceImpl(CurrentUserProvider currentUserProvider,
                                     PermissionSubjectResolver subjectResolver,
                                     KbPermissionPolicyRepository permissionPolicyRepository) {
        this.currentUserProvider = currentUserProvider;
        this.subjectResolver = subjectResolver;
        this.permissionPolicyRepository = permissionPolicyRepository;
    }

    @Override
    public void assertCanAccessDocument(UUID documentId) {
        KbUserPrincipal principal = currentUserProvider.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("permission denied"));
        if (!canAccessDocument(documentId, principal)) {
            throw new AccessDeniedException("document access denied");
        }
    }

    @Override
    public Set<UUID> filterAccessibleDocumentIds(Set<UUID> documentIds) {
        KbUserPrincipal principal = currentUserProvider.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("permission denied"));
        if (isAdmin(principal)) {
            return documentIds;
        }

        LinkedHashSet<UUID> accessible = new LinkedHashSet<>();
        for (UUID documentId : documentIds) {
            if (canAccessDocument(documentId, principal)) {
                accessible.add(documentId);
            }
        }
        return accessible;
    }

    private boolean canAccessDocument(UUID documentId, KbUserPrincipal principal) {
        if (isAdmin(principal)) {
            return true;
        }

        List<KbPermissionPolicy> policies = permissionPolicyRepository.findByResourceTypeAndResourceId("document", documentId);
        Set<String> subjects = subjectResolver.resolve(principal);

        boolean matchedAllow = false;
        for (KbPermissionPolicy policy : policies) {
            String subjectKey = normalize(policy.getSubjectType()) + ":" + normalize(policy.getSubjectValue());
            if (!subjects.contains(subjectKey)) {
                continue;
            }
            if ("deny".equals(normalize(policy.getEffect()))) {
                return false;
            }
            if ("allow".equals(normalize(policy.getEffect()))) {
                matchedAllow = true;
            }
        }

        return matchedAllow;
    }

    private boolean isAdmin(KbUserPrincipal principal) {
        return principal.getRoleCode() != null && "admin".equalsIgnoreCase(principal.getRoleCode());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
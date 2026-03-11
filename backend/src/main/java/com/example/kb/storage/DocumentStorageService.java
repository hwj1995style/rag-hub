package com.example.kb.storage;

import com.example.kb.config.KbProperties;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentStorageService {

    private final KbProperties kbProperties;

    public DocumentStorageService(KbProperties kbProperties) {
        this.kbProperties = kbProperties;
    }

    public StoredFile store(MultipartFile file) {
        String originalFileName = file.getOriginalFilename() == null ? "unknown" : file.getOriginalFilename();
        String safeFileName = sanitizeFileName(originalFileName);
        String objectKey = "uploads/" + UUID.randomUUID() + "-" + safeFileName;
        if (isMinioMode()) {
            return storeToMinio(file, originalFileName, objectKey);
        }
        return storeToLocal(file, originalFileName, objectKey);
    }

    private StoredFile storeToLocal(MultipartFile file, String originalFileName, String objectKey) {
        try {
            Path uploadRoot = Paths.get(kbProperties.getStorage().getUploadRoot()).toAbsolutePath().normalize();
            Path target = uploadRoot.resolve(objectKey.replace('/', java.io.File.separatorChar)).normalize();
            Files.createDirectories(target.getParent());
            file.transferTo(target);
            String storagePath = "/" + objectKey;
            return new StoredFile(storagePath, storagePath, originalFileName, file.getSize());
        } catch (IOException ex) {
            throw new IllegalStateException("failed to persist uploaded file locally", ex);
        }
    }

    private StoredFile storeToMinio(MultipartFile file, String originalFileName, String objectKey) {
        try (InputStream inputStream = file.getInputStream()) {
            MinioClient client = MinioClient.builder()
                    .endpoint(required(kbProperties.getStorage().getEndpoint(), "kb.storage.endpoint"))
                    .credentials(
                            required(kbProperties.getStorage().getAccessKey(), "kb.storage.access-key"),
                            required(kbProperties.getStorage().getSecretKey(), "kb.storage.secret-key"))
                    .build();
            String bucket = required(kbProperties.getStorage().getBucket(), "kb.storage.bucket");
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .contentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
                    .stream(inputStream, file.getSize(), -1)
                    .build());
            String storagePath = "minio://" + bucket + "/" + objectKey;
            return new StoredFile(storagePath, storagePath, originalFileName, file.getSize());
        } catch (Exception ex) {
            throw new IllegalStateException("failed to persist uploaded file to minio", ex);
        }
    }

    private boolean isMinioMode() {
        return "minio".equalsIgnoreCase(kbProperties.getStorage().getMode());
    }

    private String sanitizeFileName(String fileName) {
        String normalized = fileName.replace('\\', '-').replace('/', '-').replace(':', '-').trim();
        return normalized.isBlank() ? "unknown" : normalized.toLowerCase(Locale.ROOT);
    }

    private String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(fieldName + " must be configured");
        }
        return value;
    }
}

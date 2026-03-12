param(
    [string]$ElasticEndpoint = 'http://127.0.0.1:9200',
    [string]$ElasticTemplateName = 'kb_chunk_template',
    [string]$QdrantEndpoint = 'http://127.0.0.1:6333',
    [string]$QdrantCollectionName = 'kb_chunk',
    [int]$EmbeddingDim = 1024
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$templatePath = Join-Path $repoRoot 'deploy\elasticsearch\kb_chunk_index_template.json'
$qdrantPayloadPath = Join-Path $repoRoot 'deploy\qdrant\kb_chunk_collection.json'

if (-not (Test-Path $templatePath)) {
    throw "Elasticsearch template file not found: $templatePath"
}
if (-not (Test-Path $qdrantPayloadPath)) {
    throw "Qdrant collection payload file not found: $qdrantPayloadPath"
}

$templateBody = Get-Content -Path $templatePath -Raw
Invoke-RestMethod -Uri "$ElasticEndpoint/_index_template/$ElasticTemplateName" -Method Put -ContentType 'application/json' -Body $templateBody | Out-Null
Write-Host "[OK] Elasticsearch index template created: $ElasticTemplateName"

$qdrantPayload = Get-Content -Path $qdrantPayloadPath -Raw | ConvertFrom-Json
$qdrantPayload.vectors.size = $EmbeddingDim
$qdrantBody = $qdrantPayload | ConvertTo-Json -Depth 10
try {
    Invoke-RestMethod -Uri "$QdrantEndpoint/collections/$QdrantCollectionName" -Method Put -ContentType 'application/json' -Body $qdrantBody | Out-Null
    Write-Host "[OK] Qdrant collection created: $QdrantCollectionName"
}
catch {
    if ($_.Exception.Message -like '*409*') {
        Write-Host "[SKIP] Qdrant collection already exists: $QdrantCollectionName"
    }
    else {
        throw
    }
}
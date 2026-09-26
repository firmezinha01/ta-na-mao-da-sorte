Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\firme\.gemini\antigravity\brain\70ca68ac-7af4-4cf8-83a2-e0aa716ea959\.user_uploaded\media_1790438284115.jpg"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found at $sourcePath"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($image, $width, $height, $outputPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImage = New-Object System.Drawing.Bitmap($width, $height)
    $destImage.SetResolution($image.HorizontalResolution, $image.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $destImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
}

function Resize-Maskable($image, $size, $outputPath) {
    $destImage = New-Object System.Drawing.Bitmap($size, $size)
    $destImage.SetResolution($image.HorizontalResolution, $image.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # 8% padding safe zone for Android adaptive/maskable icons
    $padding = [int]($size * 0.08)
    $drawSize = $size - ($padding * 2)
    $destRect = New-Object System.Drawing.Rectangle($padding, $padding, $drawSize, $drawSize)
    $graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $destImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
}

Resize-Image $img 192 192 "c:\Users\firme\antigravity\wonderful-curie\public\icon-192.png"
Resize-Image $img 512 512 "c:\Users\firme\antigravity\wonderful-curie\public\icon-512.png"
Resize-Image $img 180 180 "c:\Users\firme\antigravity\wonderful-curie\public\apple-touch-icon.png"
Resize-Maskable $img 512 "c:\Users\firme\antigravity\wonderful-curie\public\icon-maskable.png"
Resize-Image $img 64 64 "c:\Users\firme\antigravity\wonderful-curie\public\favicon.png"

# Copia alta resolução
Copy-Item $sourcePath "c:\Users\firme\antigravity\wonderful-curie\public\logo.jpg" -Force
Resize-Image $img 512 512 "c:\Users\firme\antigravity\wonderful-curie\public\logo.png"

$img.Dispose()
Write-Output "PWA Icons and logo generated successfully from media_1790438284115.jpg!"

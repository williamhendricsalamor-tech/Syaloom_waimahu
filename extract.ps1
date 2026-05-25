Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("e:\Syaloom_waimahu\WAIMAHU DI MASA LAMPAU.docx")
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$xml = New-Object System.Xml.XmlDocument
$xml.Load($stream)
$stream.Close()
$zip.Dispose()
$nsmgr = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsmgr.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$nodes = $xml.SelectNodes("//w:p", $nsmgr)
$text = @()
foreach ($node in $nodes) {
    $text += $node.InnerText
}
$text | Out-File "extracted_text.txt" -Encoding utf8

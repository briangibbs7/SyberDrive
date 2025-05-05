param([string]$query)

$conn = New-Object -ComObject "ADODB.Connection"
$rs = New-Object -ComObject "ADODB.Recordset"
$conn.Open("Provider=Search.CollatorDSO;Extended Properties='Application=Windows'")
$rs.Open("SELECT System.ItemPathDisplay FROM SYSTEMINDEX WHERE System.FileName LIKE '%$query%'", $conn)

$results = @()
while (!$rs.EOF) {
  $results += $rs.Fields.Item("System.ItemPathDisplay").Value
  $rs.MoveNext()
}

$rs.Close()
$conn.Close()

$results -join "|~|"
for ((i=1;i<=90;i++));
do  
  echo $i
  curl -H 'Content-Type: application/x-ndjson' -XPOST 'localhost:9200/testtt/doc/_bulk?pretty' --data-binary @data/myjsonfile$i.json >/dev/null;
done
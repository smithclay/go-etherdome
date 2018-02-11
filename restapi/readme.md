## restapi

```
[ -z "$BEARER_TOKEN" ] && echo "Need to set BEARER_TOKEN" && exit 1;

curl -X POST https://api.cupel.io/networks\?auth\=$BEARER_TOKEN
```
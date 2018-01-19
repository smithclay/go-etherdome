## etherdome

![image](https://user-images.githubusercontent.com/27153/35133669-4843eacc-fc86-11e7-9520-850f02d55cd8.png | width=100)

`geth` running on AWS Lambda. WIP.

### deploying

```
    $ sam package --template-file template.yaml --s3-bucket etherdome --output-template-file packaged.yaml
    $ sam deploy --template-file ./packaged.yaml --stack-name etherdome-stack --capabilities CAPABILITY_IAM
```

### environment variables

    * `LOG_DEBUG`: include debug output in logs

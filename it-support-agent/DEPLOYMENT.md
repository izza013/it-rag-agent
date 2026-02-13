# IT Support Agent - Deployment Guide

Complete guide for deploying the IT Support Agent application with web interface.

## Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed
- PowerShell (Windows) or Bash (Linux/Mac)

## Deployment Steps

### 1. Deploy the SAM Application

```bash
# Build the application
sam build

# Deploy to AWS
sam deploy
```

After deployment, note the outputs:
- `ApiGatewayUrl` - Your API endpoint
- `WebsiteURL` - Your CloudFront URL for the web interface
- `WebHostingBucketName` - S3 bucket for web files

### 2. Deploy the Web Interface

#### Windows (PowerShell)

```powershell
.\deploy-web.ps1
```

Or with custom stack name and region:

```powershell
.\deploy-web.ps1 -StackName "your-stack-name" -Region "us-east-2"
```

#### Linux/Mac (Bash)

```bash
chmod +x deploy-web.sh
./deploy-web.sh
```

Or with custom parameters:

```bash
./deploy-web.sh your-stack-name us-east-2
```

### 3. Access Your Application

After deployment completes, access your web interface at the CloudFront URL shown in the outputs:

```
https://d1234567890abc.cloudfront.net
```

## What Gets Deployed

### Infrastructure (SAM Template)

- **Lambda Function** - IT Support Agent backend
- **API Gateway** - REST API for Lambda invocation
- **DynamoDB Table** - Session management
- **S3 Bucket** - Web interface hosting
- **CloudFront Distribution** - Global CDN for web interface
- **IAM Roles** - Permissions for Lambda and Bedrock

### Web Interface

- `index.html` - Main application
- `styles.css` - Styling
- `script.js` - Frontend logic

## Architecture

```
User → CloudFront → S3 (Static Files)
       ↓
       API Gateway → Lambda → Bedrock Agent
                      ↓
                   DynamoDB (Sessions)
```

## Security Features

- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ S3 bucket not publicly accessible
- ✅ CloudFront Origin Access Identity (OAI)
- ✅ API key authentication for API Gateway
- ✅ CORS configured properly

## Updating the Web Interface

After making changes to files in the `web/` folder:

1. Run the deployment script again:
   ```powershell
   .\deploy-web.ps1
   ```

2. Wait 5-10 minutes for CloudFront cache invalidation

3. Refresh your browser (hard refresh: Ctrl+Shift+R)

## Troubleshooting

### Web interface shows old version
- CloudFront cache may not be invalidated yet
- Wait 5-10 minutes or manually invalidate in AWS Console

### API calls failing
- Check API Gateway URL is correct in `script.js`
- Verify API key is valid
- Check Lambda function logs in CloudWatch

### S3 upload fails
- Verify AWS CLI credentials have S3 permissions
- Check bucket name in CloudFormation outputs

### CloudFront distribution not accessible
- CloudFront deployment takes 15-20 minutes initially
- Check distribution status in AWS Console

## Cost Considerations

### Free Tier Eligible
- Lambda (1M requests/month)
- API Gateway (1M requests/month)
- DynamoDB (25GB storage)
- S3 (5GB storage)
- CloudFront (1TB data transfer/month for first 12 months)

### Potential Costs
- CloudFront data transfer (after free tier)
- Bedrock API calls (pay per use)
- Lambda execution time (after free tier)

## Clean Up

To delete all resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name it-support-agent-stack --region us-east-2

# Empty and delete S3 bucket (if needed)
aws s3 rm s3://your-bucket-name --recursive
```

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Review API Gateway execution logs
3. Verify CloudFormation stack events

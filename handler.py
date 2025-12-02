import json
import boto3
import os
import uuid
import time
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Helper class to convert DynamoDB Decimal to JSON
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME')
table = dynamodb.Table(table_name)

def create_routine(event, context):
    try:
        data = json.loads(event['body'])
        
        # Validation: Ensure userId exists
        user_id = data.get('userId')
        if not user_id:
             return {
                "statusCode": 400,
                "headers": { "Access-Control-Allow-Origin": "*" },
                "body": json.dumps({"error": "userId is required"})
            }

        # solver_score logic
        duration = float(data.get('duration', 15))
        mood = float(data.get('mood', 5))
        prod = float(data.get('productivity', 5))
        score = round((mood + prod) * 10 / duration, 2)

        item = {
            'userId': user_id,           # PARTITION KEY
            'timestamp': int(time.time()), # SORT KEY
            'routineId': str(uuid.uuid4()),
            'date': data.get('date', time.strftime("%Y-%m-%d")),
            'duration': Decimal(str(duration)),
            'mood': Decimal(str(mood)),
            'productivity': Decimal(str(prod)),
            'activities': data.get('activities', []),
            'solver_score': Decimal(str(score))
        }

        table.put_item(Item=item)

        response = {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True,
            },
            "body": json.dumps(item, cls=DecimalEncoder)
        }
    except Exception as e:
        response = {
            "statusCode": 500,
            "headers": { "Access-Control-Allow-Origin": "*" },
            "body": json.dumps({"error": str(e)})
        }
    return response

def get_routines(event, context):
    try:
        # Get userId from query parameters
        params = event.get('queryStringParameters') or {}
        user_id = params.get('userId')

        if not user_id:
            return {
                "statusCode": 400,
                "headers": { "Access-Control-Allow-Origin": "*" },
                "body": json.dumps({"error": "Missing userId query parameter"})
            }

        # Query ONLY the items for this specific user
        result = table.query(
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False # Sort by timestamp descending (newest first)
        )
        
        items = result.get('Items', [])

        response = {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True,
            },
            "body": json.dumps(items, cls=DecimalEncoder)
        }
    except Exception as e:
        response = {
            "statusCode": 500,
            "headers": { "Access-Control-Allow-Origin": "*" },
            "body": json.dumps({"error": str(e)})
        }
    return response

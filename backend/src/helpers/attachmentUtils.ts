import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
//import { TodoItem } from '../models/TodoItem'
//import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
  }

  async getSignedUrl(bucketKey: string): Promise<string> {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: bucketKey,
      Expires: this.urlExpiration
    })
  }

  async updateAttachmentUrl(userId: string, todoId: string): Promise<void> {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      },
      UpdateExpression: "set attachmentUrl=:attachmentUrl",
      ExpressionAttributeValues:{
          ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
      }
    }).promise()
  }

  async deleteTodoItemAttachment(bucketKey: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: bucketKey
    }).promise()
  }
}

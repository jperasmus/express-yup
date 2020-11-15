import request from 'supertest'
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import * as yup from 'yup'
import { validate } from '.'

const app = express()

const router = request(app)

describe('Express Yup Middleware', () => {
  test('should correctly validate request parameters', async () => {
    const schema = yup.object().shape({
      params: yup.object().shape({
        param1: yup
          .string()
          .matches(/howdie/)
          .required(),
        param2: yup
          .string()
          .matches(/partner/)
          .required(),
      }),
    })

    app.get('/:param1/:param2', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    return router.get('/howdie/partner').then(response => {
      expect(response.status).toEqual(200)
    })
  })

  test('should correctly validate request headers', async () => {
    const schema = yup.object().shape({
      headers: yup.object().shape({
        authorization: yup
          .string()
          .matches(/^Bearer\s\w+$/)
          .required(),
      }),
    })

    app.get('/auth-header', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    return router
      .get('/auth-header')
      .set('authorization', 'Bearer xxx')
      .then(response => {
        expect(response.status).toEqual(200)
      })
  })

  test('should correctly validate body text', async () => {
    const schema = yup.object().shape({
      body: yup
        .string()
        .matches(/howdie/)
        .required(),
    })

    app.use(bodyParser.text())

    app.post('/body-text', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    return router
      .post('/body-text')
      .send('howdie')
      .set('Content-Type', 'text/plain')
      .then(response => {
        expect(response.status).toEqual(200)
      })
  })

  test('should correctly validate body JSON', async () => {
    const schema = yup.object().shape({
      body: yup.object().shape({
        howdie: yup
          .string()
          .matches(/partner/)
          .required(),
      }),
    })

    app.use(bodyParser.json())

    app.post('/body-json', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    return router
      .post('/body-json')
      .send({ howdie: 'partner' })
      .set('Content-Type', 'application/json')
      .then(response => {
        expect(response.status).toEqual(200)
      })
  })

  test('should correctly validate query parameters', async () => {
    const schema = yup.object().shape({
      query: yup.object().shape({
        query1: yup.string().matches(/howdie/),
        query2: yup.string().matches(/partner/),
      }),
    })

    app.get('/', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    return router
      .get('/')
      .query({
        query1: 'howdie',
        query2: 'partner',
      })
      .then(response => {
        expect(response.status).toEqual(200)
      })
  })

  test('should receive a "ValidationError" error if request does not match schema', async done => {
    const schema = yup.object().shape({
      body: yup
        .string()
        .matches(/hello/)
        .required(),
    })

    app.use(bodyParser.text())

    app.get('/error', validate(schema), (_, res) => {
      res.sendStatus(200)
    })

    // @ts-expect-error
    app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      res.send(error.message)
      expect(error instanceof yup.ValidationError).toBeTruthy()
      done()
    })

    router
      .get('/error')
      .send('thing-that-does-not-exist')
      .set('Content-Type', 'text-plain')
      .set('Accept', 'text-plain')
      .then(response => {
        expect(response.status).toEqual(400)
        expect(response.text).toEqual(
          'body must match the following: "/hello/"'
        )
      })
  })

  test('should use provided Yup options', async () => {
    const schema = yup.object().shape({
      body: yup.object().shape({
        boolTest: yup.boolean().required(),
      }),
    })

    const yupOptions = {
      strict: true,
    }

    // Creating a new Express app instance because you can't have 2 error handler routes
    const app2 = express()
    app2.use(bodyParser.json())

    app2.post('/yup-options', validate(schema, yupOptions), (_, res) => {
      res.sendStatus(200)
    })

    app2.use(
      // @ts-expect-error
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        res.json({
          name: error.name,
          message: error.message,
          // @ts-ignore
          errors: error.errors,
        })
      }
    )

    return request(app2)
      .post('/yup-options')
      .send({ boolTest: 'true' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .then(response => {
        expect(response.status).toEqual(400)
        expect(response.body).toEqual({
          name: 'ValidationError',
          message:
            'body.boolTest must be a `boolean` type, but the final value was: `"true"`.',
          errors: [
            'body.boolTest must be a `boolean` type, but the final value was: `"true"`.',
          ],
        })
      })
  })
})

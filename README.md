# Express Yup

`express-yup` is a super light-weight Express [middleware](https://expressjs.com/en/guide/using-middleware.html#using-middleware) to easily validate the Express [Request object](https://expressjs.com/en/4x/api.html#req) against a [Yup](https://www.npmjs.com/package/yup) schema.

[Yup](https://www.npmjs.com/package/yup) is a leaner alternative to [Joi](https://www.npmjs.com/package/joi), that also supports client-side validation and is the reason why this middleware was created in the first place - to easily share schemas between the client- and server-side.

> If [Joi](https://www.npmjs.com/package/joi) is more your thing, then rather use the excellent [express-validation](https://www.npmjs.com/package/express-validation) library.

## Installation

`express-yup` has two peer-dependencies that you need to ensure is installed first: `express` and `yup`.

Install from NPM:

```bash
npm install express yup # or yarn add express yup
```

If you are using TypeScript, you might want to install their type definition files as well:

```bash
npm install -D @types/express @types/yup # or yarn add -D @types/express @types/yup
```

and then install `express-yup` (it comes with its TypeScript types):

```bash
npm install express-yup # or yarn add express-yup
```

## Usage

Add as middleware to your Express app as a whole if you want to validate all routes against a specific schema, or add individually to each route (more likely):

```typescript
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import * as yup from 'yup'
import { validate } from 'express-yup'

const app = express()

// Add whatever other middleware you need for your Express app
app.use(bodyParser.json())

// Example global `express-yup` validate middleware
const authHeaderSchema = yup.object().shape({
  headers: yup.object().shape({
    authorization: yup
      .string()
      .matches(/^Bearer\s\w+$/)
      .required(),
  }),
})

app.use(validate(authHeaderSchema))

// Example route-level middleware
const routeSchema = yup.object().shape({
  // notice that we are setting our schema to validate the `body` object here
  body: yup.object().shape({
    hello: yup.string().required(),
    bye: yup.string().required(),
  }),
})

app.post(
  '/some-route',
  validate(routeSchema),
  (req: Request, res: Response) => {
    // `hello` and `bye` guaranteed to be string properties on `req.body`
    const { hello, bye } = req.body

    // Do what you need from here
  }
)

// Global error middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof yup.ValidationError) {
    res.status(400).json({ message: error.message }) // status code is 400 by default
    return
  }

  res.status(500).json({ message: 'Internal Server Error' })
})
```

### Licence

MIT

const { Router } = require('express');
const { Transaction } = require('braintree');
const logger = require('debug');
const gateway = require('../lib/gateway');

const router = Router(); // eslint-disable-line new-cap
const debug = logger('braintree_example:router');
const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement,
];

function formatErrors(errors) {
  let formattedErrors = '';

  for (let [, { code, message }] of Object.entries(errors)) {
    formattedErrors += `Error: ${code}: ${message}
`;
  }

  return formattedErrors;
}

function createResultObject({ status }) {
  let result;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message:
        'Your test transaction has been successfully processed. See the Braintree API response and try again.',
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: `Your test transaction has a status of ${status}. See the Braintree API response and try again.`,
    };
  }

  return result;
}

router.get('/', (req, res) => {
  res.redirect('/checkouts/new');
});

router.get('/checkouts/new', (req, res) => {
  gateway.clientToken.generate({}).then(({ clientToken }) => {
    res.render('checkouts/new', {
      clientToken,
      messages: req.flash('error'),
    });
  });
});

router.get('/checkouts/:id', (req, res) => {
  let result;
  const transactionId = req.params.id;

  gateway.transaction.find(transactionId).then((transaction) => {
    result = createResultObject(transaction);
    res.render('checkouts/show', { transaction, result });
  });
});

router.post('/checkouts', (req, res) => {
  // In production you should not take amounts directly from clients
  const { amount, payment_method_nonce: paymentMethodNonce, device_data } = req.body; // Add device_data here

  gateway.transaction
    .sale({
      amount,
      paymentMethodNonce,
      deviceData: device_data, // Pass deviceData to the transaction sale
      customer: {
        firstName: "Drew",
        lastName: "Smith",
        company: "Braintree",
        phone: "312-555-1234",
        fax: "312-555-12346",
        website: "http://www.example.com",
        email: "drew@example.com"
      },
      billing: {
        firstName: "Paul",
        lastName: "Smith",
        company: "Braintree",
        streetAddress: "1 E Main St",
        extendedAddress: "Suite 403",
        locality: "Chicago",
        region: "IL",
        postalCode: "60622",
        countryCodeAlpha2: "US"
      },
      shipping: {
        firstName: "Jen",
        lastName: "Smith",
        company: "Braintree",
        streetAddress: "1 E 1st St",
        extendedAddress: "5th Floor",
        locality: "Bartlett",
        region: "IL",
        postalCode: "60103",
        countryCodeAlpha2: "US"
      },
      options: { submitForSettlement: true }
    })
    .then((result) => {
      const { success, transaction } = result;

      return new Promise((resolve, reject) => {
        if (success || transaction) {
          res.redirect(`checkouts/${transaction.id}`);

          resolve();
        }

        reject(result);
      });
    })
    .catch(({ errors }) => {
      const deepErrors = errors.deepErrors();

      debug('errors from transaction.sale %O', deepErrors);

      req.flash('error', { msg: formatErrors(deepErrors) });
      res.redirect('checkouts/new');
    });
});

module.exports = router;

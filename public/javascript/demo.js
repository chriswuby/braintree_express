'use strict';

(function () {
  var amount = document.querySelector('#amount');
  var amountLabel = document.querySelector('label[for="amount"]');
  var form = document.querySelector('#payment-form');
  var clientToken = document.getElementById('client-token').innerText;

  amount.addEventListener(
    'focus',
    function () {
      amountLabel.className = 'has-focus';
    },
    false
  );
  amount.addEventListener(
    'blur',
    function () {
      amountLabel.className = '';
    },
    false
  );

  window.braintree.dropin.create(
    {
      authorization: clientToken,
      container: '#bt-dropin',
      dataCollector:true,
      paypal: {
        flow: 'checkout',
      },
    },
    function (createErr, instance) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        instance.requestPaymentMethod(function (err, payload) {
          if (err) {
            console.log('Error', err);

            return;
          }

          // Add the nonce to the form and submit
          document.querySelector('#nonce').value = payload.nonce;

          // Add device data to the form
          var deviceDataInput = document.createElement('input');
          deviceDataInput.name = 'device_data';
          deviceDataInput.type = 'hidden';
          deviceDataInput.value = payload.deviceData;
          form.appendChild(deviceDataInput);
          form.submit();
        });
      });
    }
  );
})();
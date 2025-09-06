#include <policy/feemodel.h>

#include <boost/test/unit_test.hpp>

BOOST_AUTO_TEST_SUITE(feemodel_tests)

BOOST_AUTO_TEST_CASE(calculation_clamps_and_discount)
{
    FeeModel model{CFeeRate{DEFAULT_FEE_MODEL_ALPHA}, DEFAULT_FEE_MODEL_BETA,
                   DEFAULT_FEE_MODEL_MIN, DEFAULT_FEE_MODEL_MAX};

    // Small transaction falls back to minimum fee
    BOOST_CHECK_EQUAL(CalculateFee(model, /*weight*/1, /*value*/0), model.min_fee);

    // 1 ADO with 1kvB weight => 0.000006 ADO
    BOOST_CHECK_EQUAL(CalculateFee(model, 1000, COIN), 100 + 500);

    // Consolidation halves the computed fee
    BOOST_CHECK_EQUAL(CalculateFee(model, 1000, 2 * COIN, /*consolidation*/ true), 550);

    // Very large value hits the maximum cap
    BOOST_CHECK_EQUAL(CalculateFee(model, 1000, 1'000'000 * COIN), model.max_fee);
}

BOOST_AUTO_TEST_SUITE_END()

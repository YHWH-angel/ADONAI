#include <policy/feemodel.h>

#include <common/args.h>
#include <common/messages.h>
#include <util/moneystr.h>
#include <util/translation.h>

using common::AmountErrMsg;

FeeModel g_fee_model{
    CFeeRate{DEFAULT_FEE_MODEL_ALPHA},
    DEFAULT_FEE_MODEL_BETA,
    DEFAULT_FEE_MODEL_MIN,
    DEFAULT_FEE_MODEL_MAX};

util::Result<void> ApplyArgsManFeeModel(const ArgsManager& args, FeeModel& model)
{
    if (const auto arg{args.GetArg("-feemodelalpha")}) {
        if (auto parsed = ParseMoney(*arg)) {
            model.alpha = CFeeRate{*parsed};
        } else {
            return util::Error{AmountErrMsg("feemodelalpha", *arg)};
        }
    }

    if (const auto arg{args.GetArg("-feemodelbeta")}) {
        try {
            model.beta = std::stod(*arg);
        } catch (const std::exception&) {
            return util::Error{Untranslated("Invalid -feemodelbeta, must be a number")};
        }
    }

    if (const auto arg{args.GetArg("-feemodelmin")}) {
        if (auto parsed = ParseMoney(*arg)) {
            model.min_fee = *parsed;
        } else {
            return util::Error{AmountErrMsg("feemodelmin", *arg)};
        }
    }

    if (const auto arg{args.GetArg("-feemodelmax")}) {
        if (auto parsed = ParseMoney(*arg)) {
            model.max_fee = *parsed;
        } else {
            return util::Error{AmountErrMsg("feemodelmax", *arg)};
        }
    }

    return {};
}

CAmount CalculateFee(const FeeModel& model, int64_t weight, CAmount value, bool consolidation)
{
    CAmount fee = model.alpha.GetFee(weight) + static_cast<CAmount>(std::llround(model.beta * value));
    if (consolidation) fee /= 2;
    fee = std::clamp(fee, model.min_fee, model.max_fee);
    return fee;
}

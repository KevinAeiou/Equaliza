from .above_average import above_average
from .below_average import below_average
from .concentration import concentration
from .drop import drop
from .largest_expense import largest_expense
from .projection import projection
from .rise import rise
from .savings import savings
from .total_change import total_change
from .trend import trend
from .upcoming import upcoming
from .weekday import weekday

# A ordem importa: `above_average` e `rise` registram no contexto a categoria que usaram,
# para `rise`, `trend` e `concentration` não repetirem; e os empates de tom mantêm esta ordem.
RULES = (
    above_average,
    rise,
    drop,
    total_change,
    trend,
    below_average,
    largest_expense,
    concentration,
    savings,
    projection,
    weekday,
    upcoming,
)

import pytest
from app.generator import generate_solutions
from app.generator import polynomial_to_string


def labels(solution):
    return [die["labels"] for die in solution["dice"]]


def test_classic_sicherman_pair():
    result = generate_solutions(2, 6)
    assert result["solution_count"] == 2
    assert result["non_standard_solution_count"] == 1
    nonstandard = next(s for s in result["solutions"] if not s["is_standard"])
    assert labels(nonstandard) == [
        [1, 2, 2, 3, 3, 4],
        [1, 3, 4, 5, 6, 8],
    ]


def test_tetrahedral_pair():
    result = generate_solutions(2, 4)
    assert result["solution_count"] == 2
    nonstandard = next(s for s in result["solutions"] if not s["is_standard"])
    assert labels(nonstandard) == [
        [1, 2, 2, 3],
        [1, 3, 3, 5],
    ]


def test_three_cubic_dice_matches_proof():
    result = generate_solutions(3, 6)
    assert result["solution_count"] == 2
    assert result["non_standard_solution_count"] == 1
    nonstandard = next(s for s in result["solutions"] if not s["is_standard"])
    assert labels(nonstandard) == [
        [1, 2, 2, 3, 3, 4],
        [1, 2, 3, 4, 5, 6],
        [1, 3, 4, 5, 6, 8],
    ]


def test_prime_faces_have_no_nonstandard_solution():
    result = generate_solutions(3, 5)
    assert result["solution_count"] == 1
    assert result["non_standard_solution_count"] == 0


def test_octahedral_pairs_match_proof_count():
    result = generate_solutions(2, 8)
    assert result["solution_count"] == 4
    assert result["non_standard_solution_count"] == 3
    expected = {
        ((1, 2, 2, 3, 3, 4, 4, 5), (1, 3, 5, 5, 7, 7, 9, 11)),
        ((1, 2, 2, 3, 5, 6, 6, 7), (1, 3, 3, 5, 5, 7, 7, 9)),
        ((1, 2, 3, 3, 4, 4, 5, 6), (1, 2, 5, 5, 6, 6, 9, 10)),
    }
    actual = {
        tuple(tuple(die["labels"]) for die in solution["dice"])
        for solution in result["solutions"]
        if not solution["is_standard"]
    }
    assert actual == expected


@pytest.mark.parametrize("dice", [0, 5])
def test_dice_out_of_range_raises(dice):
    with pytest.raises(ValueError, match="dice must be between 1 and 4"):
        generate_solutions(dice, 6)


@pytest.mark.parametrize("faces", [1, 21])
def test_faces_out_of_range_raises(faces):
    with pytest.raises(ValueError, match="faces must be between 2 and 20"):
        generate_solutions(2, faces)


def test_polynomial_to_string_formats_all_term_kinds():
    # Exercises the constant, linear, and higher-degree term branches as well as
    # negative coefficients and the leading-term sign handling. (The solver only
    # ever feeds non-negative, zero-constant coefficients, so these are covered
    # here directly rather than through generate_solutions.)
    assert polynomial_to_string((3, 0, 1)) == "x^2 + 3"
    assert polynomial_to_string((0, -1, 2)) == "2x^2 - x"
    assert polynomial_to_string((0, -1)) == "-x"
    assert polynomial_to_string((0, 0)) == "0"

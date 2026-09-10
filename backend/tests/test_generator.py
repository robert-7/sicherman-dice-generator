from app.generator import generate_solutions


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

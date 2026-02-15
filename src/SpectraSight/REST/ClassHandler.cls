Class SpectraSight.REST.ClassHandler [ Abstract ]
{

/// GET /api/classes - List ObjectScript classes with optional search filter
ClassMethod ListClasses() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tSearch = $GET(%request.Data("search", 1))

        Set tSQL = "SELECT Name, Super FROM %Dictionary.ClassDefinition WHERE Name NOT LIKE '\%%' ESCAPE '\' AND Name NOT LIKE '%.' AND System = 0"
        If tSearch '= "" {
            Set tSQL = tSQL _ " AND Name LIKE ?"
        }
        Set tSQL = tSQL _ " ORDER BY Name"
        Set tSQL = tSQL _ " FETCH FIRST 50 ROWS ONLY"

        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare(tSQL)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to query class definitions")
            Quit
        }

        If tSearch '= "" {
            Set tResult = tStatement.%Execute(tSearch _ "%")
        } Else {
            Set tResult = tStatement.%Execute()
        }

        Set tArray = ##class(%DynamicArray).%New()
        While tResult.%Next() {
            Set tObj = ##class(%DynamicObject).%New()
            Do tObj.%Set("name", tResult.%Get("Name"))
            Do tObj.%Set("super", tResult.%Get("Super"))
            Do tArray.%Push(tObj)
        }

        Set tSC = ##class(SpectraSight.REST.Response).Success(tArray)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while listing classes")
    }
    Quit tSC
}

/// GET /api/classes/:name/methods - List methods for a given ObjectScript class
ClassMethod ListMethods(pClassName As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        // Verify the class exists
        If '##class(%Dictionary.ClassDefinition).%ExistsId(pClassName) {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Class '" _ pClassName _ "' not found")
            Quit
        }

        Set tSQL = "SELECT Name, ClassMethod, ReturnType FROM %Dictionary.MethodDefinition WHERE parent = ?"
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare(tSQL)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to query method definitions")
            Quit
        }

        Set tResult = tStatement.%Execute(pClassName)

        Set tArray = ##class(%DynamicArray).%New()
        While tResult.%Next() {
            Set tObj = ##class(%DynamicObject).%New()
            Do tObj.%Set("name", tResult.%Get("Name"))
            Do tObj.%Set("classMethod", tResult.%Get("ClassMethod"), "boolean")
            Do tObj.%Set("returnType", tResult.%Get("ReturnType"))
            Do tArray.%Push(tObj)
        }

        Set tSC = ##class(SpectraSight.REST.Response).Success(tArray)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while listing methods")
    }
    Quit tSC
}

}

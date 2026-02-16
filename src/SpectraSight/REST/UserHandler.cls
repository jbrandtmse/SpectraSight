Class SpectraSight.REST.UserHandler [ Abstract ]
{

/// GET /api/users - List user mappings with optional isActive filter
ClassMethod ListUsers() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tIsActive = $GET(%request.Data("isActive", 1))

        Set tSQL = "SELECT ID FROM SpectraSight_Model.UserMapping"
        If tIsActive = "true" {
            Set tSQL = tSQL _ " WHERE IsActive = 1"
        } ElseIf tIsActive = "false" {
            Set tSQL = tSQL _ " WHERE IsActive = 0"
        }
        Set tSQL = tSQL _ " ORDER BY DisplayName"

        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare(tSQL)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to prepare user query")
            Quit
        }

        Set tResult = tStatement.%Execute()
        Set tArray = ##class(%DynamicArray).%New()

        While tResult.%Next() {
            Set tMapping = ##class(SpectraSight.Model.UserMapping).%OpenId(tResult.%Get("ID"))
            If tMapping '= "" {
                Set tObj = ..BuildUserResponse(tMapping)
                Do tArray.%Push(tObj)
            }
        }

        Set tSC = ##class(SpectraSight.REST.Response).Success(tArray)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while listing users")
    }
    Quit tSC
}

/// POST /api/users - Create a new user mapping
ClassMethod CreateUser() As %Status
{
    Set tSC = $$$OK
    Try {
        // Guard against empty/missing request body
        If (%request.Content = "") || ('$ISOBJECT(%request.Content)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Request body is required")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)
        Set tIrisUsername = tBody.%Get("irisUsername")
        Set tDisplayName = tBody.%Get("displayName")

        // Validate required fields
        If (tIrisUsername = "") || (tIrisUsername = $CHAR(0)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("irisUsername is required")
            Quit
        }
        If $LENGTH(tIrisUsername) > 128 {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("irisUsername exceeds maximum length of 128 characters")
            Quit
        }
        If (tDisplayName = "") || (tDisplayName = $CHAR(0)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("displayName is required")
            Quit
        }
        If $LENGTH(tDisplayName) > 255 {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("displayName exceeds maximum length of 255 characters")
            Quit
        }

        // Create new user mapping
        Set tMapping = ##class(SpectraSight.Model.UserMapping).%New()
        Set tMapping.IrisUsername = tIrisUsername
        Set tMapping.DisplayName = tDisplayName

        // Save - catch unique constraint violation on IrisUsername
        Set tSC2 = tMapping.%Save()
        If $$$ISERR(tSC2) {
            Set tErrorText = $System.Status.GetErrorText(tSC2)
            If (tErrorText [ "unique") || (tErrorText [ "Unique") || (tErrorText [ "UNIQUE") || (tErrorText [ "UsernameIdx") {
                Set tSC = ##class(SpectraSight.REST.Response).BadRequest("A user mapping with username '"_tIrisUsername_"' already exists")
                Quit
            }
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save user mapping: "_tErrorText)
            Quit
        }

        Set tResponse = ..BuildUserResponse(tMapping)
        Set tSC = ##class(SpectraSight.REST.Response).Created(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while creating the user mapping")
    }
    Quit tSC
}

/// GET /api/users/:id - Get a single user mapping
ClassMethod GetUser(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tMapping = ##class(SpectraSight.Model.UserMapping).%OpenId(pId)
        If tMapping = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("User mapping not found")
            Quit
        }

        Set tResponse = ..BuildUserResponse(tMapping)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while retrieving the user mapping")
    }
    Quit tSC
}

/// PUT /api/users/:id - Update a user mapping
ClassMethod UpdateUser(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tMapping = ##class(SpectraSight.Model.UserMapping).%OpenId(pId)
        If tMapping = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("User mapping not found")
            Quit
        }

        // Guard against empty/missing request body
        If (%request.Content = "") || ('$ISOBJECT(%request.Content)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Request body is required")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)

        // Validate at least one updatable field is provided
        If 'tBody.%IsDefined("displayName") && 'tBody.%IsDefined("isActive") {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("At least one field (displayName or isActive) must be provided")
            Quit
        }

        // Update displayName if provided
        If tBody.%IsDefined("displayName") {
            Set tNewDisplayName = tBody.%Get("displayName")
            If $LENGTH(tNewDisplayName) > 255 {
                Set tSC = ##class(SpectraSight.REST.Response).BadRequest("displayName exceeds maximum length of 255 characters")
                Quit
            }
            Set tMapping.DisplayName = tNewDisplayName
        }

        // Update isActive if provided
        If tBody.%IsDefined("isActive") {
            Set tMapping.IsActive = tBody.%Get("isActive")
        }

        Set tSC2 = tMapping.%Save()
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save user mapping: "_$System.Status.GetErrorText(tSC2))
            Quit
        }

        Set tResponse = ..BuildUserResponse(tMapping)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while updating the user mapping")
    }
    Quit tSC
}

/// DELETE /api/users/:id - Delete a user mapping
ClassMethod DeleteUser(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tMapping = ##class(SpectraSight.Model.UserMapping).%OpenId(pId)
        If tMapping = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("User mapping not found")
            Quit
        }

        // Check if user is assigned to any tickets
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Assignee = ?")
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to check ticket assignments")
            Quit
        }
        Set tResult = tStatement.%Execute(tMapping.DisplayName)
        Set tTicketCount = 0
        If tResult.%Next() {
            Set tTicketCount = tResult.%Get("cnt")
        }
        If tTicketCount > 0 {
            Set tSC = ##class(SpectraSight.REST.Response).Conflict("Cannot delete user assigned to tickets")
            Quit
        }

        // Delete the user mapping
        Set tSC2 = ##class(SpectraSight.Model.UserMapping).%DeleteId(pId)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to delete user mapping: "_$System.Status.GetErrorText(tSC2))
            Quit
        }

        Set tSC = ##class(SpectraSight.REST.Response).SuccessNoContent()
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while deleting the user mapping")
    }
    Quit tSC
}

/// Build a %DynamicObject response from a UserMapping object
ClassMethod BuildUserResponse(pMapping As SpectraSight.Model.UserMapping) As %DynamicObject
{
    Set tObj = ##class(%DynamicObject).%New()
    Try {
        Do tObj.%Set("id", pMapping.%Id(), "number")
        Do tObj.%Set("irisUsername", pMapping.IrisUsername)
        Do tObj.%Set("displayName", pMapping.DisplayName)
        Do tObj.%Set("isActive", pMapping.IsActive, "boolean")
        Do tObj.%Set("createdAt", pMapping.CreatedAt)
        Do tObj.%Set("updatedAt", pMapping.UpdatedAt)
    }
    Catch ex {
        Set ^ClaudeDebug("REST", "BuildUserResponse", "error") = ex.DisplayString()
    }
    Quit tObj
}

}
